-- 1. 建立或確保 users 資料表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 建立或確保 contents 資料表 (儲存清單、私房景點與私房料理)
CREATE TABLE IF NOT EXISTS public.contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users NOT NULL,
  type TEXT NOT NULL DEFAULT 'SPOT',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 升級 contents 型態限制
ALTER TABLE public.contents DROP CONSTRAINT IF EXISTS contents_type_check;
ALTER TABLE public.contents ADD CONSTRAINT contents_type_check CHECK (type IN ('SPOT', 'DISH', 'LIST'));

-- 擴充 contents 私房欄位 (若已存在自動略過)
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS photos TEXT[];
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS recommended_dishes TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS dining_review TEXT;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT true;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 3. 建立社群留言板與願望清單表
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.contents ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.contents ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(content_id, user_id)
);

-- 4. 建立單筆授權 (access_grants) 與 全帳號好友授權 (user_grants) 表
CREATE TABLE IF NOT EXISTS public.access_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.contents NOT NULL,
  grantee_user_id UUID REFERENCES public.users,
  access_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.user_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES public.users NOT NULL,
  grantee_user_id UUID REFERENCES public.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(owner_user_id, grantee_user_id)
);

-- 5. 開啟 RLS (資料列安全政策)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 6. RLS 政策定義 (安全覆蓋與清理舊政策)
DROP POLICY IF EXISTS "Users can view own profile." ON public.users;
DROP POLICY IF EXISTS "Users can view own and connected profiles." ON public.users;
CREATE POLICY "Users can view own and connected profiles." ON public.users FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.user_grants
    WHERE (owner_user_id = public.users.id AND grantee_user_id = auth.uid())
       OR (grantee_user_id = public.users.id AND owner_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage their own contents." ON public.contents;
CREATE POLICY "Users can manage their own contents." ON public.contents FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Granted users can view contents." ON public.contents;
CREATE POLICY "Granted users can view contents." ON public.contents FOR SELECT USING (
  NOT is_locked OR
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.access_grants 
    WHERE content_id = public.contents.id 
    AND grantee_user_id = auth.uid()
  ) OR
  (
    EXISTS (
      SELECT 1 FROM public.user_grants
      WHERE owner_user_id = public.contents.user_id
      AND grantee_user_id = auth.uid()
    )
    AND (is_private IS NOT TRUE)
  )
);

DROP POLICY IF EXISTS "Users can view grants involved in." ON public.user_grants;
CREATE POLICY "Users can view grants involved in." ON public.user_grants FOR SELECT USING (
  auth.uid() = owner_user_id OR auth.uid() = grantee_user_id
);

DROP POLICY IF EXISTS "Grantee can insert user grants." ON public.user_grants;
CREATE POLICY "Grantee can insert user grants." ON public.user_grants FOR INSERT WITH CHECK (
  auth.uid() = grantee_user_id
);

DROP POLICY IF EXISTS "Users can delete involved user grants." ON public.user_grants;
CREATE POLICY "Users can delete involved user grants." ON public.user_grants FOR DELETE USING (
  auth.uid() = owner_user_id OR auth.uid() = grantee_user_id
);

-- Create a security definer function to check content ownership without triggering policies
CREATE OR REPLACE FUNCTION public.is_content_owner(check_content_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contents
    WHERE id = check_content_id AND user_id = check_user_id
  );
$$;

DROP POLICY IF EXISTS "Users can manage access grants for their own contents." ON public.access_grants;
CREATE POLICY "Users can manage access grants for their own contents." ON public.access_grants FOR ALL USING (
  public.is_content_owner(content_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can view access grants granted to them." ON public.access_grants;
CREATE POLICY "Users can view access grants granted to them." ON public.access_grants FOR SELECT USING (grantee_user_id = auth.uid());

DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert comments" ON public.comments;
CREATE POLICY "Users insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- 7. Trigger: 註冊自動建立了 public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', 'User_' || substring(md5(random()::text) from 1 for 6)), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Storage 權限設定 (確保 photos Bucket 可以被讀取與上傳)
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.uid() = owner);
